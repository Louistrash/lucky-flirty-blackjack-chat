import { AiChatRequest, CheckHealthData, SendChatMessageData } from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * No description
   * @tags AI Chat, dbtn/module:ai_chat, dbtn/hasAuth
   * @name send_chat_message
   * @summary Send Chat Message
   * @request POST:/routes/ai-chat/send-message
   */
  export namespace send_chat_message {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AiChatRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SendChatMessageData;
  }
}
