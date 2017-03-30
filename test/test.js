const Code = require('code');
const Lab = require('lab');

const lab = Lab.script();

lab.experiment('math', () => {
  lab.test('returns true when 1 + 1 equals 2', (done) => {
    Code.expect(1 + 1).to.equal(2);
    done();
  });
});

exports.lab = lab;
