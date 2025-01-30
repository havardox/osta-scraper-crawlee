export default function cleanInnerHtml(content: string) {
  // Match and clean inner content between HTML tags
  return content.replace(/>\s+|\s+</g, (match) => match.trim());
}
