import * as fc from 'fast-check';

describe('Fast-check setup verification', () => {
  it('should run property-based tests', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      })
    );
  });

  it('should handle string properties', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return s.length >= 0;
      })
    );
  });
});