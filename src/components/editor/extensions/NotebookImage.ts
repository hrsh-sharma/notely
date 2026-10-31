import Image from '@tiptap/extension-image';

export const NotebookImage = Image.configure({
  inline: false,
  allowBase64: true,
  HTMLAttributes: {
    class: 'notebook-image',
    style: 'max-width: 100%; border-radius: 8px; margin: 8px 0; display: block;',
  },
});

