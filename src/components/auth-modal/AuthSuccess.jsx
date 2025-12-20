function SuccessCheck() {
  return (
    <svg className="auth-success-check" viewBox="0 0 52 52">
      <circle
        className="auth-success-check__circle"
        cx="26"
        cy="26"
        r="25"
        fill="none"
      />
      <path
        className="auth-success-check__check"
        fill="none"
        d="M14 27l7 7 17-17"
      />
    </svg>
  );
}

function AuthSuccess({ successType, onLogin }) {
  return (
    <div className="auth-success">
      <SuccessCheck />
      <h2 className="auth-success-title">Uspešno</h2>

      <p className="auth-success-text">
        {successType === "verify_or_login" && (
          <>
            Ako je ovo nova registracija, poslali smo vam email za potvrdu.
            <br />
            Ukoliko već imate nalog, možete se odmah prijaviti.
          </>
        )}
        {successType === "forgot" && (
          <>
            Link za resetovanje lozinke je poslat na vašu email adresu.
            <br />
            Proverite inbox za dalja uputstva.
          </>
        )}
        {successType === "auth" && <>Uspešno ste se prijavili.</>}
      </p>

      {successType === "verify_or_login" && (
        <button className="auth-link" onClick={onLogin}>
          Idi na prijavu
        </button>
      )}
    </div>
  );
}

export default AuthSuccess;
