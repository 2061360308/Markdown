import yaml from "js-yaml";
import { format } from 'date-fns';

export const splitFrontMatter = (content: string) => {
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

export const parseFrontMatter = (content: string) => {
  let parsedYaml = <Record<string, any>>{};
  if (content) {
    try {
      parsedYaml = yaml.load(content.replace(/^---|---$/g, "")) as Record<
        string,
        any
      >;
    } catch (e) {
      console.error("Error parsing YAML:", e);
    }
  }

  return parsedYaml;
};

export const formatDate = (date: Date, formatString: string, offset:string) => {
  return format(date, formatString) + offset;
};

export const stringifyFrontMatter = (frontMatter: Record<string, any>) => {
  console.log("frontMatterObject", frontMatter);
  for (const key in frontMatter) {
    console.log("key", key);
    let value = frontMatter[key];
    if (value instanceof Date) {
      console.log("formatDate", formatDate(value, "yyyy-MM-dd'T'HH:mm:ss", "+08:00"));
      frontMatter[key] = formatDate(value, "yyyy-MM-dd'T'HH:mm:ss", "+08:00");
    }
  }
  return `---\n${yaml.dump(frontMatter)}---\n`;
};
