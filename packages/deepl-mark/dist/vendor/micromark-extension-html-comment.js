import { factorySpace } from "micromark-factory-space";
import { markdownLineEnding } from "micromark-util-character";
import { codes } from "micromark-util-symbol/codes.js";
import { types } from "micromark-util-symbol/types.js";
function htmlComment() {
  return {
    flow: {
      [codes.lessThan]: { tokenize, concrete: true }
    },
    text: {
      [codes.lessThan]: { tokenize }
    }
  };
}
function htmlCommentToHtml() {
  return {
    enter: {
      htmlComment() {
        this.buffer();
      }
    },
    exit: {
      htmlComment() {
        this.resume();
      }
    }
  };
}
const tokenize = (effects, ok, nok) => {
  let value = "";
  return start;
  function start(code) {
    effects.enter("htmlComment");
    effects.enter("htmlCommentMarker");
    effects.consume(code);
    value += "<";
    return open;
  }
  function open(code) {
    if (value === "<" && code === codes.exclamationMark) {
      effects.consume(code);
      value += "!";
      return open;
    }
    if (code === codes.dash) {
      if (value === "<!") {
        effects.consume(code);
        value += "-";
        return open;
      }
      if (value === "<!-") {
        effects.consume(code);
        effects.exit("htmlCommentMarker");
        value += "-";
        return inside;
      }
    }
    return nok(code);
  }
  function inside(code) {
    if (code === codes.eof) return nok(code);
    if (markdownLineEnding(code)) {
      effects.exit(types.data);
      return atLineEnding(code);
    }
    if (code === codes.greaterThan) {
      return close(code);
    }
    if (value === "<!--") {
      effects.enter("htmlCommentString");
      effects.enter(types.data);
    }
    effects.consume(code);
    if (code === codes.dash) {
      value += "-";
    } else {
      value += "*";
    }
    return inside;
  }
  function atLineEnding(code) {
    effects.enter(types.lineEnding);
    effects.consume(code);
    effects.exit(types.lineEnding);
    return factorySpace(effects, afterLinePrefix, types.linePrefix);
  }
  function afterLinePrefix(code) {
    if (markdownLineEnding(code)) return atLineEnding(code);
    effects.enter(types.data);
    return inside(code);
  }
  function close(code) {
    if (value.length >= 6 && value.slice(-2) === "--") {
      effects.consume(code);
      effects.exit(types.data);
      effects.exit("htmlCommentString");
      effects.exit("htmlComment");
      value += ">";
      return ok;
    }
    return nok(code);
  }
};
export {
  htmlComment,
  htmlCommentToHtml
};
