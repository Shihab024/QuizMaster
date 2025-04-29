import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="align-items-center">
          <Col md={4} className="text-center text-md-left mb-3 mb-md-0">
            <p className="footer-text">
              © {new Date().getFullYear()} QuizMaster. All rights reserved.
            </p>
          </Col>
          <Col md={4} className="text-center mb-3 mb-md-0">
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/ai-quiz">AI Quizzes</Link>
              </li>
            </ul>
          </Col>
          <Col md={4} className="text-center text-md-right">
            <p className="footer-text">
              API by Gemini AI | Created by S.M. Shihab
            </p>
            <ul className="social-links">
              <li>
                <a
                  href="https://github.com/Shihab024"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <FaGithub size={24} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/smshihab-sharar-685604325/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={24} />
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;