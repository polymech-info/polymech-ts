"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    parse: function (tagToken, remainTokens) {
        this.tokens = [];
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream
            .on('token', (token) => {
            if (token.name === 'endraw')
                stream.stop();
            else
                this.tokens.push(token);
        })
            .on('end', () => {
            throw new Error(`tag ${tagToken.getText()} not closed`);
        });
        stream.start();
    },
    render: function () {
        return this.tokens.map((token) => token.getText()).join('');
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9yYXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxrQkFBZTtJQUNiLEtBQUssRUFBRSxVQUFVLFFBQWtCLEVBQUUsWUFBNkI7UUFDaEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUE7UUFFaEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQzNELE1BQU07YUFDSCxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBZSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVE7Z0JBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFBOztnQkFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDOUIsQ0FBQyxDQUFDO2FBQ0QsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7WUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtRQUN6RCxDQUFDLENBQUMsQ0FBQTtRQUNKLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUNoQixDQUFDO0lBQ0QsTUFBTSxFQUFFO1FBQ04sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQW9CLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUM1RSxDQUFDO0NBQ2dCLENBQUEifQ==