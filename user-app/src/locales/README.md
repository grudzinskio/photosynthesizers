# Translation Files

This directory contains all translation files for the multi-language support feature.

## Structure

- `en.json` - English translations (reference language)
- `es.json` - Spanish translations
- `zh.json` - Chinese translations
- `index.ts` - Translation loader and helper functions
- `validateTranslations.ts` - Validation logic for translation files
- `validate.ts` - Standalone validation script

## Translation File Format

Translation files use nested JSON structure with camelCase keys:

```json
{
  "section": {
    "subsection": {
      "key": "Translated text"
    }
  }
}
```

## Validation Rules

The validation system checks for:

1. **Proper Nesting**: All keys must be properly nested objects or string values
2. **No Duplicate Keys**: Keys should not be duplicated (enforced by JSON format)
3. **Consistent Naming**: All keys must follow camelCase convention (e.g., `foundIt`, not `found-it` or `FoundIt`)
4. **Key Consistency**: All languages must have the same keys as English (reference language)
5. **No Empty Objects**: Translation objects cannot be empty
6. **Valid Types**: Values must be either strings (leaf nodes) or objects (nested sections)

## Running Validation

### During Development

Validation runs automatically as part of the test suite:

```bash
npm test
```

### Manual Validation

To run validation separately (runs the validation test suite):

```bash
npm run validate:translations
```

This will check:
- All keys are properly nested
- No duplicate keys exist
- All keys follow camelCase naming convention
- All languages have the same keys as English
- No empty objects exist
- All values are either strings or nested objects

### In CI/CD

Add validation to your CI pipeline to ensure translation quality:

```bash
npm run validate:translations
```

## Adding New Translations

1. Add the new key to `en.json` first (reference language)
2. Add the same key with translated text to `es.json` and `zh.json`
3. Run validation to ensure consistency: `npm run validate:translations`
4. Run tests to verify: `npm test`

## Interpolation

Translation strings can include variables using `{{variableName}}` syntax:

```json
{
  "chat": {
    "subtitle": "Get answers to your questions about {{plantName}}"
  }
}
```

Use the `interpolate` function from `index.ts` to replace variables at runtime.

## Adding New Languages

1. Create a new JSON file (e.g., `fr.json` for French)
2. Copy the structure from `en.json`
3. Translate all values
4. Add the language to `SupportedLanguage` type in `index.ts`
5. Import and add to `translations` object in `index.ts`
6. Add language metadata to `availableLanguages` array
7. Run validation to ensure consistency

## Best Practices

- Keep keys descriptive but concise
- Use camelCase for all keys
- Group related translations under common sections
- Maintain consistent structure across all language files
- Test translations in the UI to ensure they fit properly
- Consider text length differences between languages
- Use native speakers for translation review when possible
