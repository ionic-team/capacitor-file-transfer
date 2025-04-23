import { registerPlugin } from "@capacitor/core";
import { exposeSynapse } from "@capacitor/synapse";

import type { FileTransferPlugin } from "./definitions";

const FileTransfer = registerPlugin<FileTransferPlugin>("FileTransfer", {
  web: () => import("./web").then((m) => new m.FileTransferWeb()),
});

exposeSynapse();

export * from "./definitions";
export { FileTransfer };
