import googleIcon from "../../assets/google.svg";
import appleIcon from "../../assets/apple.svg";

function OAuthButtons({ onGoogle, onApple, loading }) {
  return (
    <div className="auth-social">
      <button
        className="auth-social-btn google"
        onClick={onGoogle}
        disabled={loading}
      >
        <img src={googleIcon} alt="Google" />
        Nastavi sa Google
      </button>

      <button
        className="auth-social-btn apple"
        onClick={onApple}
        disabled
      >
        <img src={appleIcon} alt="Apple" />
        Nastavi sa Apple
      </button>
    </div>
  );
}

export default OAuthButtons;
