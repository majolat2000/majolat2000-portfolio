import handler from "./hook.mjs";
const req = { method: "POST", headers: {}, body: {} };
const res = {
  _status: null,
  status(c) { this._status = c; return this; },
  json(o) { console.log("STATUS", this._status, JSON.stringify(o)); },
};
await handler(req, res);
console.log("HANDLER_OK");
