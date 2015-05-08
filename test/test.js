import Papi from '../src/papi.es6';

// TODO: TESTS HERE
describe('Papi setJwt', function () {
  it('should return current JWT Papi.auth.setJwt', () => {
    Papi.auth.setJwt('testing')
    expect(Papi.auth.jwt).toEqual('testing');
  });
});
