# Internationalization (i18n) Setup

This project uses `react-i18next` for internationalization with support for English, Portuguese, Spanish, and French.

## Structure

```
src/i18n/
├── index.ts              # i18n configuration
├── locales/
│   ├── en.json          # English translations
│   ├── pt.json          # Portuguese translations
│   ├── es.json          # Spanish translations
│   └── fr.json          # French translations
└── README.md            # This file
```

## Usage

### 1. Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
};
```

### 2. Using the Custom Hook

```tsx
import { useI18n } from '../hooks/useI18n';

const MyComponent = () => {
  const { t, changeLanguage, getCurrentLanguage } = useI18n();

  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
  };

  return (
    <div>
      <p>Current language: {getCurrentLanguage()}</p>
      <button onClick={() => handleLanguageChange('pt')}>
        Switch to Portuguese
      </button>
    </div>
  );
};
```

### 3. Language Switcher Component

```tsx
import LanguageSwitcher from '../components/LanguageSwitcher';

const Header = () => {
  return (
    <header>
      <h1>My App</h1>
      <LanguageSwitcher />
    </header>
  );
};
```

## Translation Keys

The translation files are organized by feature:

- `nav.*` - Navigation items
- `hero.*` - Hero section content
- `weather.*` - Weather-related text
- `search.*` - Search functionality
- `barraca.*` - Barraca-specific content
- `login.*` - Login form
- `admin.*` - Admin panel content
- `common.*` - Common UI elements

## Adding New Translations

1. Add the translation key to all locale files (`en.json`, `pt.json`, `es.json`, `fr.json`)
2. Use the key in your component with `t('your.key')`

Example:

```json
// en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}

// pt.json
{
  "newFeature": {
    "title": "Nova Funcionalidade",
    "description": "Esta é uma nova funcionalidade"
  }
}
```

```tsx
// In your component
const { t } = useTranslation();
return <h2>{t('newFeature.title')}</h2>;
```

## Interpolation

You can use interpolation for dynamic values:

```json
{
  "welcome": "Welcome, {{name}}!",
  "items": "{{count}} items found"
}
```

```tsx
const { t } = useTranslation();
return (
  <div>
    <p>{t('welcome', { name: 'John' })}</p>
    <p>{t('items', { count: 5 })}</p>
  </div>
);
```

## Pluralization

For pluralization, use the `count` parameter:

```json
{
  "item": "{{count}} item",
  "item_plural": "{{count}} items"
}
```

```tsx
const { t } = useTranslation();
return <p>{t('item', { count: 5 })}</p>; // "5 items"
```

## Configuration

The i18n configuration is in `src/i18n/index.ts`:

- **Fallback language**: English (`en`)
- **Language detection**: Automatic browser detection
- **Debug mode**: Disabled in production
- **Interpolation**: HTML escaping disabled for React

## Available Languages

- 🇺🇸 English (`en`)
- 🇧🇷 Portuguese (`pt`)
- 🇪🇸 Spanish (`es`)
- 🇫🇷 French (`fr`)

## Language Persistence

The selected language is automatically saved to localStorage and restored on page reload.
