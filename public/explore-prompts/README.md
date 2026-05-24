# Explore prompts — your content

The gallery starts **empty**. Add each card in:

`lib/explore-prompts-catalog.ts` → `EXPLORE_PROMPTS`

## Current entry

| id | model | preview file |
|----|-------|----------------|
| `gpt-image-2-sunlit-hydration` | GPT Image 2 | `gpt-image-2-sunlit-hydration.webp` |

## Example entry

```ts
{
  id: "gpt-image-2-my-shot",
  modelId: "gpt-image-2",
  title: "My title",
  prompt: "English prompt sent to Atlas — keep prompts in English",
  aspectRatio: "9:16"
}
```

## Preview image

Save as: `public/explore-prompts/<id>.webp`  
(same `id` as in the catalog)

Or set `imageUrl: "https://..."` in the catalog entry.

## Other models

Use any `modelId` from the image studio (e.g. `gpt-image-2`, `seedream-5`).
