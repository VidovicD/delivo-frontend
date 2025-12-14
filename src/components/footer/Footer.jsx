import "./Footer.css";

const Footer = () => {
  return (
    <footer>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Delivo | Sva prava zadržana.
      </div>
    </footer>
  );
};

export default Footer;
