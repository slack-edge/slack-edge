import { assert, test, describe } from "vitest";
import { AppMentionEvent, UserConnectionStatusRequestedEvent } from "../src/index";

describe("Events", () => {
  test("app_mention", () => {
    const event: AppMentionEvent = {
      type: "app_mention",
      text: "<@U066C7XNE6M> hey",
      files: [
        {
          id: "F111",
          created: 1707806342,
          timestamp: 1707806342,
          name: "test.png",
          title: "test.png",
          mimetype: "image/png",
          filetype: "png",
          pretty_type: "PNG",
          user: "U03E94MK0",
          user_team: "T111",
          editable: false,
          size: 1312009,
          mode: "hosted",
          is_external: false,
          external_type: "",
          is_public: true,
          public_url_shared: false,
          display_as_bot: false,
          username: "",
          url_private: "https://files.slack.com/files-pri/T111-F111/test.png",
          url_private_download: "https://files.slack.com/files-pri/T111-F111/download/test.png",
          media_display_type: "unknown",
          thumb_64: "https://files.slack.com/files-tmb/T111-F111-test/test_64.png",
          thumb_80: "https://files.slack.com/files-tmb/T111-F111-test/test_80.png",
          thumb_360: "https://files.slack.com/files-tmb/T111-F111-test/test_360.png",
          thumb_360_w: 360,
          thumb_360_h: 262,
          thumb_480: "https://files.slack.com/files-tmb/T111-F111-test/test_480.png",
          thumb_480_w: 480,
          thumb_480_h: 350,
          thumb_160: "https://files.slack.com/files-tmb/T111-F111-test/test_160.png",
          thumb_720: "https://files.slack.com/files-tmb/T111-F111-test/test_720.png",
          thumb_720_w: 720,
          thumb_720_h: 525,
          thumb_800: "https://files.slack.com/files-tmb/T111-F111-test/test_800.png",
          thumb_800_w: 800,
          thumb_800_h: 583,
          thumb_960: "https://files.slack.com/files-tmb/T111-F111-test/test_960.png",
          thumb_960_w: 960,
          thumb_960_h: 700,
          thumb_1024: "https://files.slack.com/files-tmb/T111-F111-test/test_1024.png",
          thumb_1024_w: 1024,
          thumb_1024_h: 747,
          original_w: 1772,
          original_h: 1292,
          thumb_tiny: "xxx",
          permalink: "https://xxx.slack.com/files/U03E94MK0/F111/test.png",
          permalink_public: "https://slack-files.com/T111-F111-a0770c9e47",
          is_starred: false,
          has_rich_preview: false,
          file_access: "visible",
        },
      ],
      upload: false,
      user: "U03E94MK0",
      display_as_bot: false,
      ts: "1707806347.397809",
      blocks: [
        {
          type: "rich_text",
          block_id: "t9D3L",
          elements: [
            {
              type: "rich_text_section",
              elements: [
                {
                  type: "user",
                  user_id: "U066C7XNE6M",
                },
                {
                  type: "text",
                  text: " hey",
                },
              ],
            },
          ],
        },
      ],
      client_msg_id: "883e5317-28e3-4ef8-9385-b88343560de6",
      channel: "CHE2DUW5V",
      event_ts: "1707806347.397809",
    };
    assert.equal(event.type, "app_mention");
  });
  test("user_connection_status_requested", () => {
    const event: UserConnectionStatusRequestedEvent = {
      type: "user_connection_status_requested",
      user: "U123",
      event_ts: "1763337600.000100",
    };
    assert.equal(event.type, "user_connection_status_requested");
  });
});
