"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamedEmitter = void 0;
const underscore_1 = require("../util/underscore");
const stream_1 = require("stream");
class StreamedEmitter {
    constructor() {
        this.buffer = '';
        this.stream = new stream_1.PassThrough();
    }
    write(html) {
        this.stream.write((0, underscore_1.stringify)(html));
    }
    error(err) {
        this.stream.emit('error', err);
    }
    end() {
        this.stream.end();
    }
}
exports.StreamedEmitter = StreamedEmitter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtZWQtZW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9lbWl0dGVycy9zdHJlYW1lZC1lbWl0dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQUE4QztBQUU5QyxtQ0FBb0M7QUFFcEMsTUFBYSxlQUFlO0lBQTVCO1FBQ1MsV0FBTSxHQUFHLEVBQUUsQ0FBQztRQUNaLFdBQU0sR0FBMkIsSUFBSSxvQkFBVyxFQUFFLENBQUE7SUFVM0QsQ0FBQztJQVRRLEtBQUssQ0FBRSxJQUFTO1FBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUEsc0JBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFDTSxLQUFLLENBQUUsR0FBVTtRQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEMsQ0FBQztJQUNNLEdBQUc7UUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ25CLENBQUM7Q0FDRjtBQVpELDBDQVlDIn0=