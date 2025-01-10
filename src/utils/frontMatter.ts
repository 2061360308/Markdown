import yaml from "js-yaml";

export const splitFrontMatter = (content) => {
  const yalmPattern = /^---[\s\S]*?---/;
  const yamlMatch = content.match(yalmPattern);
  const yamlContent = yamlMatch ? yamlMatch[0] : "";
  const cleanedContent = content.replace(yamlContent, "");

  let frontMatter = {};

  if (yamlContent) {
    frontMatter = parseFrontMatter(yamlContent);
  }

  return {
    frontMatter,
    content: cleanedContent,
  };
};

export const parseFrontMatter = (content) => {
  let parsedYaml = {};
  if (content) {
    try {
      parsedYaml = yaml.load(content.replace(/^---|---$/g, ""));
    } catch (e) {
      console.error("Error parsing YAML:", e);
    }
  }

  return parsedYaml;
};
