import { AiChatRequest, CheckHealthData, SendChatMessageData, SendChatMessageError } from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags AI Chat, dbtn/module:ai_chat, dbtn/hasAuth
   * @name send_chat_message
   * @summary Send Chat Message
   * @request POST:/routes/ai-chat/send-message
   */
  send_chat_message = (data: AiChatRequest, params: RequestParams = {}) =>
    this.request<SendChatMessageData, SendChatMessageError>({
      path: `/routes/ai-chat/send-message`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
