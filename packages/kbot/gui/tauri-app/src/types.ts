export interface ImageFile {
  path: string;
  src: string;
  selected?: boolean;
  isGenerated?: boolean;
}

export interface GeneratedImage {
  src: string;
  filename: string;
}

export interface PromptTemplate {
  name: string;
  text: string;
}
