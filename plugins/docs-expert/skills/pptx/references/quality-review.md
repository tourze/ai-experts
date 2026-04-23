# Slide Quality Review

## Scoring (5 dimensions, weighted)

| Dimension | Weight | Pass |
|-----------|--------|------|
| Layout balance | 25% | Elements distributed evenly, visual center stable, within safe area |
| Readability | 25% | Body font >= 14pt (caption/footnote exempt per style preset), contrast >= 4.5:1, clear hierarchy |
| Typography | 20% | Consistent fonts, proper line-height, aligned |
| Info density | 20% | <= 5 info blocks per slide, not overloaded or empty |
| Color harmony | 10% | Matches spec_lock palette, contrast >= 4.5:1 |

**Hard gates**: Layout balance >= 6/10 AND Readability >= 6/10, otherwise redo.

## Per-slide checklist

1. Title exists, font >= 24pt
2. Body font >= 16pt (projection: >= 18pt)
3. Text-background contrast >= 4.5:1
4. All elements in safe area (>= 0.5" from edges)
5. Info blocks <= 5
6. Colors match spec_lock palette
7. Fonts match spec_lock spec
8. CJK text has full font-family chain
9. Images/icons have alt text attribute
10. page_rhythm tag matches actual layout density

## Deck-level checklist

1. No 3 consecutive dense pages
2. Primary color consistent; accent colors <= 2
3. Narrative arc: cover -> problem -> solution -> ending
4. Consistent card style, border-radius, shadows across all pages
5. anchor/breathing pages >= 30% of deck

## Common issues & fixes

| Problem | Fix |
|---------|-----|
| Text overflows card | Reduce text or enlarge container |
| All pages same layout | Vary page_rhythm (dense/anchor/breathing) |
| Too many colors (>4 primary) | Return to spec_lock palette |
| Title/body size ratio < 1.5x | Increase title or decrease body size |
| CJK text in italic | Use bold instead |
| Elements outside safe area | Move inward >= 36pt from edges |
| No visual hierarchy | Add size/weight/color contrast between levels |
| Walls of text | Extract to bullet points or icon grid |
| Missing breathing pages | Insert quote/image/KPI pages between dense sections |
| Inconsistent alignment | Pick one alignment per slide (center or left), not mixed |
