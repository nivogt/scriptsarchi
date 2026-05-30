function normalizeFormat(format) {
  return String(format || "").trim();
}

function hasFormat(format) {
  return normalizeFormat(format).length > 0;
}

function isTlsEnabled(tlsVersion) {
  return String(tlsVersion || "").toLowerCase() !== "none";
}

function buildLabelExpression(protocol, port, tlsVersion, format) {
  var normalizedFormat = normalizeFormat(format);
  var protocolText = String(protocol || "").trim();
  var portText = String(port || "").trim();
  var tlsText = String(tlsVersion || "").trim();

  var expression = "${name}(" + protocolText + "/" + portText;

  if (isTlsEnabled(tlsText)) {
    expression += " - " + tlsText;
  }

  expression += ")";

  if (hasFormat(normalizedFormat)) {
    expression += "\nFormat: " + normalizedFormat;
  }

  return expression;
}

function buildElementUpdateRecord(protocol, port, tlsVersion, format) {
  var record = {
    properties: {
      Protocol: String(protocol || ""),
      Port: String(port || ""),
      "TLS Version": String(tlsVersion || "")
    },
    labelExpression: buildLabelExpression(protocol, port, tlsVersion, format)
  };

  if (hasFormat(format)) {
    record.properties.Format = normalizeFormat(format);
  }

  return record;
}

function shouldContinue(selectionSize, dialogResult, okOption) {
  if (typeof selectionSize !== "number") {
    throw new Error("selectionSize must be a number");
  }
  return selectionSize > 0 && dialogResult === okOption;
}

module.exports = {
  normalizeFormat,
  hasFormat,
  isTlsEnabled,
  buildLabelExpression,
  buildElementUpdateRecord,
  shouldContinue
};
