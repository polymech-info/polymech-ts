"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class TestimonialsRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'discussion';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    forProduct(objectId) {
        this.forItem(objectId, 'P');
        return this;
    }
    forCategory(objectId) {
        this.forItem(objectId, 'C');
        return this;
    }
    forArticle(objectId) {
        this.forItem(objectId, 'A');
        return this;
    }
    forOrder(objectId) {
        this.forItem(objectId, 'O');
        return this;
    }
    forStorefront(objectId) {
        this.forItem(objectId, 'E');
        return this;
    }
    forVendor(objectId) {
        this.forItem(objectId, 'M');
        return this;
    }
    forItem(objectId, objectType) {
        this.params.object_id = objectId;
        this.params.object_type = objectType;
    }
    create(object_id, object_type, name, rating_value, message) {
        return this.post({
            object_id,
            object_type,
            name,
            rating_value,
            message,
        });
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language, params: {
                page: this.params.page,
                items_per_page: this.params.items_per_page,
            } });
        delete this.params.page;
        delete this.params.items_per_page;
    }
}
exports.default = TestimonialsRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdGltb25pYWxzUmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY3NjYXJ0L2FwaS1yZXF1ZXN0L1Rlc3RpbW9uaWFsc1JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSx1REFBK0M7QUFFL0MsTUFBcUIsbUJBQW9CLFNBQVEseUJBQWU7SUFNOUQsWUFBWSxNQUFxQixFQUFFLE1BQWM7UUFDL0MsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQU52QixlQUFVLEdBQVcsWUFBWSxDQUFDO1FBQ2xDLFdBQU0sR0FBVyxNQUFNLENBQUE7UUFNckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVNLFVBQVUsQ0FBQyxRQUFnQjtRQUNoQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUUzQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxXQUFXLENBQUMsUUFBZ0I7UUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFFM0IsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU0sVUFBVSxDQUFDLFFBQWdCO1FBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBRTNCLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVNLFFBQVEsQ0FBQyxRQUFnQjtRQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUUzQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxhQUFhLENBQUMsUUFBZ0I7UUFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFFM0IsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU0sU0FBUyxDQUFDLFFBQWdCO1FBQy9CLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBRTNCLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVTLE9BQU8sQ0FBQyxRQUFnQixFQUFFLFVBQXVCO1FBQ3pELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDdkMsQ0FBQztJQUVELE1BQU0sQ0FDSixTQUFpQixFQUNqQixXQUF3QixFQUN4QixJQUFZLEVBQ1osWUFBcUIsRUFDckIsT0FBZ0I7UUFFaEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2YsU0FBUztZQUNULFdBQVc7WUFDWCxJQUFJO1lBQ0osWUFBWTtZQUNaLE9BQU87U0FDUixDQUFDLENBQUE7SUFDSixDQUFDO0lBRVMsU0FBUztRQUNqQixJQUFJLENBQUMsTUFBTSxtQ0FDTixJQUFJLENBQUMsTUFBTSxLQUNkLFFBQVEsRUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsRUFBRSxFQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxTQUFTLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ2hDLE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJO2dCQUN0QixjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjO2FBQzNDLEdBQ0YsQ0FBQTtRQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUE7UUFDdkIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQTtJQUNuQyxDQUFDO0NBQ0Y7QUFwRkQsc0NBb0ZDIn0=