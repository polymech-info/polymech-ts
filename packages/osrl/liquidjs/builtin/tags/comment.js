"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    parse: function (tagToken, remainTokens) {
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream
            .on('token', (token) => {
            if (token.name === 'endcomment')
                stream.stop();
        })
            .on('end', () => {
            throw new Error(`tag ${tagToken.getText()} not closed`);
        });
        stream.start();
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL3RhZ3MvY29tbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUlBLGtCQUFlO0lBQ2IsS0FBSyxFQUFFLFVBQVUsUUFBa0IsRUFBRSxZQUE2QjtRQUNoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDM0QsTUFBTTthQUNILEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFlLEVBQUUsRUFBRTtZQUMvQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssWUFBWTtnQkFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDaEQsQ0FBQyxDQUFDO2FBQ0QsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7WUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtRQUN6RCxDQUFDLENBQUMsQ0FBQTtRQUNKLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUNoQixDQUFDO0NBQ2dCLENBQUEifQ==