import os
import requests
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

class PlantSummarizer:
    def __init__(self, tavily_api_key=None, openai_api_key=None):
        """
        Initialize the PlantSummarizer with Tavily and OpenAI.
        
        Args:
            tavily_api_key: Tavily API key (or set TAVILY_API_KEY env var)
            openai_api_key: OpenAI API key (or set OPENAI_API_KEY env var)
            
        Raises:
            ValueError: If required environment variables are not set
        """
        # Get API keys from parameters or environment variables
        tavily_key = tavily_api_key or os.getenv("TAVILY_API_KEY")
        openai_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        
        # Validate required environment variables
        if not tavily_key:
            raise ValueError("TAVILY_API_KEY environment variable is not set. Please set it in your .env file.")
        if not openai_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it in your .env file.")
        
        self.tavily_client = TavilyClient(api_key=tavily_key)
        self.api_key = openai_key
        self.api_url = "https://api.openai.com/v1/chat/completions"


    """
    WHEN THE USER GETS THE PLANT NAME CORRECTLY, THEN WE WILL GET THE SUMMARY OF THE PLANT.
    """
        
    def summarize(self, plant, model="gpt-4o-mini", max_tokens=500):
        """
        Get a summary of a plant using Tavily search and OpenAI.
        
        Args:
            plant: Name of the plant to summarize
            model: OpenAI model to use (e.g., "gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo")
            max_tokens: Maximum tokens in the summary
            
        Returns:
            str: Summary of the plant
        """
        # Search for plant information using Tavily
        search_query = f"{plant} plant information"
        search_results = self.tavily_client.search(
            query=search_query,
            search_depth="advanced",
            max_results=5
        )
        
        # Extract relevant content from search results
        context = self._extract_context(search_results)
        
        # Generate summary using OpenAI
        summary = self._generate_summary(plant, context, model, max_tokens)
        
        return summary
    
    def _extract_context(self, search_results):
        """Extract and combine relevant content from Tavily search results."""
        context_parts = []
        
        for result in search_results.get('results', []):
            title = result.get('title', '')
            content = result.get('content', '')
            context_parts.append(f"{title}: {content}")
        
        return "\n\n".join(context_parts)
    
    def _generate_summary(self, plant, context, model, max_tokens):
        """Generate a plant summary using OpenAI."""
        prompt = f"""Based on the following information about {plant}, provide a comprehensive but concise summary covering:
        - Basic description and characteristics
        - Growing conditions (light, water, soil)
        - Care requirements

        Information:
        {context}

        Please provide a clear, informative summary of the plant for users in a botanical garden to help them learn more about it."""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful botanical expert who provides clear, accurate plant information."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        
        response = requests.post(
            self.api_url,
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']

    """
    WHEN THE USER ASKS A FOLLOW UP QUESTION
    """
    
    def follow_up_question(self, plant, question, model="gpt-4o-mini", max_tokens=500):
        """
        Answer a follow-up question about a plant using Tavily search and OpenAI.
        
        Args:
            plant: Name of the plant
            question: User's question about the plant
            model: OpenAI model to use (e.g., "gpt-4o-mini", "gpt-4o")
            max_tokens: Maximum tokens in the response
            
        Returns:
            str: Answer to the user's question
        """
        # Search for information related to the specific question
        search_query = f"{plant} {question}"
        search_results = self.tavily_client.search(
            query=search_query,
            search_depth="advanced",
            max_results=5
        )
        
        # Extract relevant context
        context = self._extract_context(search_results)
        
        # Generate answer using OpenAI
        answer = self._generate_follow_up_answer(plant, question, context, model, max_tokens)
        
        return answer
    
    def _generate_follow_up_answer(self, plant, question, context, model, max_tokens):
        """Generate an answer to a follow-up question using OpenAI."""
        prompt = f"""Based on the following information about {plant}, provide a clear and helpful answer to this question: {question}

        Information:
        {context}

        Please provide an accurate, informative response that directly addresses the user's question."""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful botanical expert who answers questions about plants clearly and accurately."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        
        response = requests.post(
            self.api_url,
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']


# Example usage
if __name__ == "__main__":
    # Initialize the summarizer
    summarizer = PlantSummarizer()
    
    # Get a summary of a plant
    plant_name = "Monstera Deliciosa"
    summary = summarizer.summarize(plant_name)
    
    print(f"Summary of {plant_name}:")
    print(summary)
    
    # Ask a follow-up question
    question = "How often should I water it?"
    answer = summarizer.follow_up_question(plant_name, question)
    
    print(f"\nQuestion: {question}")
    print(f"Answer: {answer}")