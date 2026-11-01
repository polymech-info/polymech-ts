function htmlCommentFromMarkdown() {
  return {
    canContainEols: ["htmlComment"],
    enter: {
      htmlComment() {
        this.buffer();
      }
    },
    exit: {
      htmlComment(token) {
        const string = this.resume();
        this.enter(
          {
            // @ts-ignore
            type: "htmlComment",
            value: string.slice(0, -3)
          },
          token
        );
        this.exit(token);
      }
    }
  };
}
function htmlCommentToMarkdown() {
  return {
    handlers: {
      htmlComment(node) {
        return `<!--${node.value}-->`;
      }
    }
  };
}
export {
  htmlCommentFromMarkdown,
  htmlCommentToMarkdown
};
