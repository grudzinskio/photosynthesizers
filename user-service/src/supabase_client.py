"""
Supabase client initialization module.
Provides a singleton Supabase client instance for the application.
Supports async operations using run_in_executor to avoid blocking the event loop.
"""
import os
import asyncio
from typing import Callable, Any
from supabase import create_client, Client
from supabase.client import ClientOptions
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
def get_supabase_client() -> Client:
    """
    Get or create the Supabase client instance.
    Uses secret key if available (bypasses RLS), otherwise uses publishable key.
    
    Returns:
        Supabase Client instance
        
    Raises:
        ValueError: If SUPABASE_URL or required key environment variables are not set
    """
    supabase_url = os.getenv("SUPABASE_URL")
    # Try secret key first (bypasses RLS), fallback to publishable key
    supabase_key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_PUBLISHABLE_KEY")
    
    if not supabase_url:
        raise ValueError("SUPABASE_URL environment variable is not set")
    if not supabase_key:
        raise ValueError("SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY environment variable must be set")
    
    # Configure client options to avoid auto-refresh and session persistence
    client_options = ClientOptions(
        auto_refresh_token=False,
        persist_session=False,
    )
    
    return create_client(supabase_url, supabase_key, options=client_options)

# Singleton instance
_supabase_client: Client = None

def get_client() -> Client:
    """
    Get the singleton Supabase client instance.
    Creates it on first call.
    
    Returns:
        Supabase Client instance
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = get_supabase_client()
    return _supabase_client


async def async_execute(query_builder_callable: Callable[[], Any]) -> Any:
    """
    Execute a Supabase query builder chain asynchronously in a thread pool.
    
    This prevents blocking the event loop when making database operations.
    
    Args:
        query_builder_callable: A callable that returns a query builder with .execute() method.
                                Example: lambda: client.table("users").select("*").eq("id", "123")
    
    Returns:
        The result of the .execute() call
    
    Example:
        # Instead of:
        response = client.table("users").select("*").eq("id", user_id).execute()
        
        # Use:
        response = await async_execute(
            lambda: client.table("users").select("*").eq("id", user_id)
        )
    """
    loop = asyncio.get_event_loop()
    def _execute_in_thread():
        return query_builder_callable().execute()
    return await loop.run_in_executor(None, _execute_in_thread)

