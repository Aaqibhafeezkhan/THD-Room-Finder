The single in-app control that flips locale between English and German. A Material 3 segmented control; the active segment fills with primary (THD blue). Use `size="small"` (EN/DE pill) in an app bar or rail; `size="medium"` (English/Deutsch) in a settings list.

```jsx
const [lang, setLang] = React.useState('en');
const t = (en, de) => (lang === 'en' ? en : de);

// App-bar pill:
<LanguageToggle value={lang} onChange={setLang} size="small" />

// Settings row:
<LanguageToggle value={lang} onChange={setLang} size="medium" />
```

`onChange` gives you the locale id; keep your own `t(en, de)` helper (or a string table) and re-render. Because every other component takes its label text as props, switching `lang` and re-passing labels is all it takes — no component needs to know the language. Remember German strings run ~25–35% longer: never hard-cap label widths.
