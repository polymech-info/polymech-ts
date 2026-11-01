export const t = 2;
document.getElementById('okButton')?.addEventListener('click', () => {
    const textareaContent = (document.getElementById('textarea') as HTMLTextAreaElement).value;
    (window as any).electronAPI.submitContent(textareaContent);
});
