// City input with Bahrain's areas suggested, grouped by governorate, with
// their Arabic names (session 31). Any other place can still be typed;
// the server tidies known spellings ("المنامة", "manama" -> "Manama").
import { useId } from 'react';
import { GOVERNORATES, placeName } from '../../../shared/areas.js';
import { currentLang } from '../i18n.jsx';

export default function CityField({ governorates = false, ...props }) {
  const listId = useId();
  const lang = currentLang();
  return (
    <>
      <input {...props} list={listId} autoComplete="off" />
      <datalist id={listId}>
        {GOVERNORATES.flatMap((g) => [
          ...(governorates ? [<option key={g.key} value={g.en}>{lang === 'ar' ? g.ar : g.en}</option>] : []),
          ...g.areas.map(([en]) => <option key={en} value={en}>{`${placeName(en, lang)} · ${lang === 'ar' ? g.ar : g.en}`}</option>),
        ])}
      </datalist>
    </>
  );
}

// A city as text, in the reader's language when it's a known area.
export function Place({ city }) {
  return <bdi>{placeName(city, currentLang())}</bdi>;
}
