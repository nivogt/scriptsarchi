const {
  normalizeFormat,
  hasFormat,
  isTlsEnabled,
  buildLabelExpression,
  buildElementUpdateRecord,
  shouldContinue
} = require('../src/networkInfoHelpers');

describe('Network info helper logic', () => {
  test('builds a label expression with TLS when format is empty', () => {
    expect(buildLabelExpression('https', '443', 'TLS 1.2', '')).toBe(
      '${name}(https/443 - TLS 1.2)'
    );
  });

  test('builds a label expression with format text', () => {
    expect(buildLabelExpression('https', '443', 'TLS 1.2', 'JSON')).toBe(
      '${name}(https/443 - TLS 1.2)\nFormat: JSON'
    );
  });

  test('builds a label expression without TLS when tlsVersion is none', () => {
    expect(buildLabelExpression('https', '443', 'none', 'JSON')).toBe(
      '${name}(https/443)\nFormat: JSON'
    );
  });

  test('normalizes blank and whitespace-only format values', () => {
    expect(normalizeFormat('   ')).toBe('');
    expect(hasFormat('   ')).toBe(false);
  });

  test('detects a format value correctly', () => {
    expect(hasFormat('XML')).toBe(true);
  });

  test('reports TLS enabled except for none', () => {
    expect(isTlsEnabled('TLS 1.2')).toBe(true);
    expect(isTlsEnabled('none')).toBe(false);
  });

  test('builds update record without Format when format is blank', () => {
    var record = buildElementUpdateRecord('https', '443', 'TLS 1.2', '  ');
    expect(record.properties).toEqual({
      Protocol: 'https',
      Port: '443',
      'TLS Version': 'TLS 1.2'
    });
    expect(record.labelExpression).toBe('${name}(https/443 - TLS 1.2)');
  });

  test('builds update record with Format when format is present', () => {
    var record = buildElementUpdateRecord('https', '443', 'TLS 1.2', 'XML');
    expect(record.properties).toEqual({
      Protocol: 'https',
      Port: '443',
      'TLS Version': 'TLS 1.2',
      Format: 'XML'
    });
    expect(record.labelExpression).toBe('${name}(https/443 - TLS 1.2)\nFormat: XML');
  });

  test('should continue only when selection exists and OK dialog result is returned', () => {
    expect(shouldContinue(1, 0, 0)).toBe(true);
    expect(shouldContinue(1, 1, 0)).toBe(false);
    expect(shouldContinue(0, 0, 0)).toBe(false);
  });
});
