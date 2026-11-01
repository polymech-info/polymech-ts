"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyAccessToken = void 0;
const token_1 = require("./token");
const identifier_token_1 = require("./identifier-token");
const token_kind_1 = require("../parser/token-kind");
const parse_string_literal_1 = require("../parser/parse-string-literal");
class PropertyAccessToken extends token_1.Token {
    constructor(variable, props, end) {
        super(token_kind_1.TokenKind.PropertyAccess, variable.input, variable.begin, end, variable.file);
        this.variable = variable;
        this.props = props;
        this.propertyName = this.variable instanceof identifier_token_1.IdentifierToken
            ? this.variable.getText()
            : (0, parse_string_literal_1.parseStringLiteral)(this.variable.getText());
    }
}
exports.PropertyAccessToken = PropertyAccessToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHktYWNjZXNzLXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3Rva2Vucy9wcm9wZXJ0eS1hY2Nlc3MtdG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQStCO0FBQy9CLHlEQUFvRDtBQUVwRCxxREFBZ0Q7QUFDaEQseUVBQW1FO0FBRW5FLE1BQWEsbUJBQW9CLFNBQVEsYUFBSztJQUU1QyxZQUNTLFFBQXVDLEVBQ3ZDLEtBQThELEVBQ3JFLEdBQVc7UUFFWCxLQUFLLENBQUMsc0JBQVMsQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7UUFKNUUsYUFBUSxHQUFSLFFBQVEsQ0FBK0I7UUFDdkMsVUFBSyxHQUFMLEtBQUssQ0FBeUQ7UUFJckUsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxZQUFZLGtDQUFlO1lBQzFELENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUN6QixDQUFDLENBQUMsSUFBQSx5Q0FBa0IsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7SUFDakQsQ0FBQztDQUNGO0FBWkQsa0RBWUMifQ==