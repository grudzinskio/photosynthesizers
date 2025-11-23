#!/usr/bin/env node

/**
 * Standalone script to validate translation files
 * Run with: npm run validate:translations
 */

import { runValidation } from './validateTranslations';

const isValid = runValidation();

// Exit with error code if validation fails
process.exit(isValid ? 0 : 1);
