"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class BmLayoutsRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'ext_bm_layouts';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    withBlocks() {
        this.handlerParams.withBlocks = true;
        return this;
    }
    withSlug(slug) {
        this.handlerParams.withSlug = slug;
        return this;
    }
    forLocation(location) {
        this.handlerParams.location = location;
        return this;
    }
    buildUrl() {
        let url = super.buildUrl();
        url = url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
        url = url + (this.handlerParams.location ? `sra_ext_bm_locations/${this.handlerParams.location}/` : '');
        url = url + (this.handlerParams.withBlocks ? 'sra_ext_bm_blocks/' : '');
        url = url + (this.handlerParams.withSlug || '');
        return url;
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
    }
}
exports.default = BmLayoutsRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGF5b3V0c1JlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NzY2FydC9hcGktcmVxdWVzdC9MYXlvdXRzUmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLHVEQUErQztBQUUvQyxNQUFxQixnQkFBaUIsU0FBUSx5QkFBZTtJQU0zRCxZQUFZLE1BQXFCLEVBQUUsTUFBYztRQUMvQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBTnZCLGVBQVUsR0FBWSxnQkFBZ0IsQ0FBQTtRQUN0QyxXQUFNLEdBQWdCLE1BQU0sQ0FBQTtRQU0xQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRU0sVUFBVTtRQUNmLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUNyQyxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxRQUFRLENBQUMsSUFBbUI7UUFDakMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ25DLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVNLFdBQVcsQ0FBQyxRQUFnQjtRQUNqQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDdkMsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRVMsUUFBUTtRQUNoQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDMUIsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3ZHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVoRCxPQUFPLEdBQUcsQ0FBQTtJQUNaLENBQUM7SUFFUyxTQUFTO1FBQ2pCLElBQUksQ0FBQyxNQUFNLG1DQUNOLElBQUksQ0FBQyxNQUFNLEtBQ2QsUUFBUSxFQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxFQUFFLEVBQVUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ2hDLFNBQVMsRUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FDakMsQ0FBQTtJQUNILENBQUM7Q0FDRjtBQTdDRCxtQ0E2Q0MifQ==