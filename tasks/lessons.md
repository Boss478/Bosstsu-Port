# Lessons Learned

## Tailwind CSS Flex Layouts & Aspect Ratio
- **Issue**: Using `aspect-video w-full` on a child element inside a flex container (e.g., `flex-col`) can result in a computed height of `0px` if it shrinks, preventing the content (such as a cover image or background placeholder) from rendering.
- **Solution**: Always use explicit heights (e.g., `h-48 sm:h-56`) combined with `shrink-0`, or ensure the parent and child elements have proper constraints (`min-h-[xxxpx]`) so the aspect ratio doesn't collapse.
