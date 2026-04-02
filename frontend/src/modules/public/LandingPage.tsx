import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Calendar, Mail, Heart,
  ChevronUp, Linkedin, Twitter, Send,
  Activity, Stethoscope
} from 'lucide-react';
import '../../styles/landing.css';

// Image imports  
import slider1 from '../../assets/images/slider1.png';
import slider2 from '../../assets/images/slider2.png';
import slider3 from '../../assets/images/slider3.png';
import aboutBg from '../../assets/images/about-bg.png';
import teamImage1 from '../../assets/images/team-image1.png';
import teamImage2 from '../../assets/images/team-image2.png';
import teamImage3 from '../../assets/images/team-image3.jpg';
import newsImage1 from '../../assets/images/news-image1.jpg';
import newsImage2 from '../../assets/images/news-image2.jpg';
import newsImage3 from '../../assets/images/news-image3.jpg';
import appointmentImage from '../../assets/images/appointment-image.jpg';
import authorImage from '../../assets/images/author-image.jpg';
import newsImage from '../../assets/images/news-image.jpg';

/* ============================
   Intersection Observer hook
   ============================ */
const useFadeIn = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    const elements = el.querySelectorAll('.fade-in-up');
    elements.forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, []);

  return ref;
};

/* ============================
   Hero Carousel
   ============================ */
const slides = [
  {
    image: slider1,
    subtitle: 'AI-Driven ECG Signal Analysis',
    title: 'Intelligent Heart Diagnosis',
    btn: { text: 'Meet Our Cardiologists', href: '#team', className: 'section-btn' },
  },
  {
    image: slider2,
    subtitle: 'Deep Learning for Cardiac Classification',
    title: 'Advanced ECG Analysis',
    btn: { text: 'About Our Platform', href: '#about', className: 'section-btn btn-gray' },
  },
  {
    image: slider3,
    subtitle: 'CNN–LSTM Cardiac Signal Processing',
    title: 'Precision Cardiology',
    btn: { text: 'Latest Research', href: '#news', className: 'section-btn btn-blue' },
  },
];

const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-slider" id="home">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`hero-slide ${i === current ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="hero-overlay">
            {i === current && (
              <div className="hero-content">
                <h3>{slide.subtitle}</h3>
                <h1>{slide.title}</h1>
                <button
                  className={slide.btn.className}
                  onClick={() => scrollTo(slide.btn.href)}
                >
                  {slide.btn.text}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

/* ============================
   Main Landing Page
   ============================ */
export const LandingPage: React.FC = () => {
  const fadeRef = useFadeIn();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href);
    if (el) {
      const offset = 60;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="landing-page" ref={fadeRef}>
      {/* PRELOADER */}
      <div className={`preloader ${!loading ? 'loaded' : ''}`}>
        <div className="spinner"><span /></div>
      </div>

      {/* TOP BAR */}
      <div className="top-bar">
        <div className="container">
          <div className="row" style={{ alignItems: 'center' }}>
            <div className="col-6" style={{ flex: '0 0 40%', maxWidth: '40%' }}>
              <p>Welcome to CardioAI ECG Diagnosis Platform</p>
            </div>
            <div className="col-6 text-align-right" style={{ flex: '0 0 60%', maxWidth: '60%' }}>
              <span>
                <Phone size={12} className="icon" /> 010-060-0160
              </span>
              <span className="date-icon">
                <Calendar size={12} className="icon" /> 8:00 AM – 6:00 PM (Mon–Fri)
              </span>
              <span>
                <Mail size={12} className="icon" />{' '}
                <a href="mailto:contact@cardioai.com">contact@cardioai.com</a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className={`main-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-inner">
            <a href="#home" className="nav-brand" onClick={(e) => { e.preventDefault(); scrollTo('#home'); }}>
              <Heart size={24} className="brand-icon" />
              CardioAI
            </a>

            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              <span /><span /><span />
            </button>

            <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollTo('#home'); }}>Home</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about'); }}>About</a></li>
              <li><a href="#team" onClick={(e) => { e.preventDefault(); scrollTo('#team'); }}>Cardiologists</a></li>
              <li><a href="#news" onClick={(e) => { e.preventDefault(); scrollTo('#news'); }}>Research</a></li>
              <li><a href="#appointment" onClick={(e) => { e.preventDefault(); scrollTo('#appointment'); }}>Contact</a></li>
              <li className="nav-cta">
                <Link to="/login">Sign In</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <HeroSlider />

      {/* ABOUT */}
      <section
        id="about"
        className="about-section"
        style={{ backgroundImage: `url(${aboutBg})` }}
      >
        <div className="container">
          <div className="row">
            <div className="col-6">
              <div className="about-info">
                <h2 className="fade-in-up delay-2">
                  Welcome to <Heart size={28} style={{ color: '#a5c422', verticalAlign: 'middle' }} /> CardioAI
                </h2>
                <div className="fade-in-up delay-4">
                  <p>
                    CardioAI leverages state-of-the-art deep learning to analyze electrocardiogram
                    (ECG) time-series data for intelligent cardiac diagnosis. Our hybrid CNN–LSTM
                    pipeline extracts local features from ECG segments and captures temporal
                    dependencies to deliver precise multi-class classification.
                  </p>
                  <p>
                    Designed for research and clinical decision support, the platform enables
                    cardiologists to upload 12-lead ECG recordings, run automated analysis, and
                    review prediction history with comprehensive performance metrics including
                    ROC curves, confusion matrices, and F1-scores.
                  </p>
                </div>
                <div className="profile fade-in-up delay-5">
                  <img src={authorImage} alt="Dr. Amira Hassan" />
                  <div className="profile-info">
                    <h3>Dr. Amira Hassan</h3>
                    <p>Chief Cardiologist & AI Lead</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARDIOLOGISTS / TEAM */}
      <section id="team" className="team-section">
        <div className="container">
          <div className="row">
            <div className="col-6">
              <div className="about-info">
                <h2 className="fade-in-up delay-1">Our Cardiologists</h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-4">
              <div className="team-thumb fade-in-up delay-2">
                <img src={teamImage1} alt="Dr. Marc Chen" />
                <div className="team-info">
                  <h3>Dr. Marc Chen</h3>
                  <p>Interventional Cardiologist</p>
                  <div className="team-contact-info">
                    <p><Phone size={12} className="icon" /> 010-020-0120</p>
                    <p><Mail size={12} className="icon" /> <a href="#">cardio@cardioai.com</a></p>
                  </div>
                  <div className="social-icon">
                    <a href="#" aria-label="LinkedIn"><Linkedin size={14} /></a>
                    <a href="#" aria-label="Email"><Mail size={14} /></a>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="team-thumb fade-in-up delay-4">
                <img src={teamImage2} alt="Dr. Sarah Jenkins" />
                <div className="team-info">
                  <h3>Dr. Sarah Jenkins</h3>
                  <p>Electrophysiologist</p>
                  <div className="team-contact-info">
                    <p><Phone size={12} className="icon" /> 010-070-0170</p>
                    <p><Mail size={12} className="icon" /> <a href="#">electro@cardioai.com</a></p>
                  </div>
                  <div className="social-icon">
                    <a href="#" aria-label="Twitter"><Twitter size={14} /></a>
                    <a href="#" aria-label="Email"><Mail size={14} /></a>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="team-thumb fade-in-up delay-6">
                <img src={teamImage3} alt="Dr. Karim Al-Rashid" />
                <div className="team-info">
                  <h3>Dr. Karim Al-Rashid</h3>
                  <p>Cardiac AI Researcher</p>
                  <div className="team-contact-info">
                    <p><Phone size={12} className="icon" /> 010-040-0140</p>
                    <p><Mail size={12} className="icon" /> <a href="#">research@cardioai.com</a></p>
                  </div>
                  <div className="social-icon">
                    <a href="#" aria-label="LinkedIn"><Linkedin size={14} /></a>
                    <a href="#" aria-label="Email"><Mail size={14} /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWS / RESEARCH */}
      <section id="news" className="news-section">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="section-title fade-in-up delay-1">
                <h2>Latest Cardiac Research</h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-4">
              <div className="news-thumb fade-in-up delay-2">
                <img src={newsImage1} alt="Deep Learning for ECG" />
                <div className="news-info">
                  <span>March 15, 2026</span>
                  <h3><a href="#">Deep Learning for 12-Lead ECG Classification</a></h3>
                  <p>Exploring how convolutional neural networks detect arrhythmias and myocardial infarction patterns in standard ECG recordings.</p>
                  <div className="author">
                    <img src={authorImage} alt="Dr. Chen" />
                    <div className="author-info">
                      <h5>Dr. Marc Chen</h5>
                      <p>Lead Researcher</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="news-thumb fade-in-up delay-4">
                <img src={newsImage2} alt="ResNet ECG Analysis" />
                <div className="news-info">
                  <span>February 28, 2026</span>
                  <h3><a href="#">ResNet-Based Arrhythmia Detection Pipeline</a></h3>
                  <p>Our ResNet architecture achieves 97.3% accuracy on the PTB-XL dataset for multi-class cardiac condition classification.</p>
                  <div className="author">
                    <img src={authorImage} alt="Dr. Jenkins" />
                    <div className="author-info">
                      <h5>Dr. Sarah Jenkins</h5>
                      <p>Electrophysiology Lead</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="news-thumb fade-in-up delay-6">
                <img src={newsImage3} alt="PTB-XL Dataset" />
                <div className="news-info">
                  <span>January 20, 2026</span>
                  <h3><a href="#">PTB-XL Dataset: Benchmark for Cardiac AI</a></h3>
                  <p>How the PTB-XL 12-lead ECG dataset with 21,837 records drives innovation in cardiac signal analysis and machine learning.</p>
                  <div className="author">
                    <img src={authorImage} alt="Dr. Al-Rashid" />
                    <div className="author-info">
                      <h5>Dr. Karim Al-Rashid</h5>
                      <p>AI Research Director</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APPOINTMENT / ECG ANALYSIS CTA */}
      <section id="appointment" className="appointment-section">
        <div className="container">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="col-6">
              <img
                src={appointmentImage}
                alt="ECG Analysis"
                className="fade-in-up delay-2"
              />
            </div>
            <div className="col-6">
              <form
                id="appointment-form"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="section-title fade-in-up delay-3">
                  <h2>Request ECG Analysis</h2>
                </div>
                <div className="fade-in-up delay-4">
                  <div className="row">
                    <div className="col-6">
                      <label htmlFor="appt-name">Name</label>
                      <input type="text" className="form-control" id="appt-name" placeholder="Full Name" />
                    </div>
                    <div className="col-6">
                      <label htmlFor="appt-email">Email</label>
                      <input type="email" className="form-control" id="appt-email" placeholder="Your Email" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <label htmlFor="appt-date">Select Date</label>
                      <input type="date" className="form-control" id="appt-date" />
                    </div>
                    <div className="col-6">
                      <label htmlFor="appt-type">ECG Type</label>
                      <select className="form-control" id="appt-type">
                        <option>12-Lead Resting ECG</option>
                        <option>Holter Monitor (24h)</option>
                        <option>Stress Test ECG</option>
                        <option>Event Recorder</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <label htmlFor="appt-phone">Phone Number</label>
                      <input type="tel" className="form-control" id="appt-phone" placeholder="Phone" />
                      <label htmlFor="appt-notes">Clinical Notes</label>
                      <textarea className="form-control" id="appt-notes" rows={4} placeholder="Describe symptoms or provide clinical context..." />
                      <button type="submit" className="submit-btn">
                        Request Analysis
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="row">
            <div className="col-4">
              <div className="footer-thumb">
                <h4 className="fade-in-up delay-2">Contact Info</h4>
                <p>CardioAI provides AI-powered ECG analysis for cardiac diagnosis, supporting clinicians with deep learning classification of heart conditions.</p>
                <div className="contact-info-footer">
                  <p><span className="icon"><Phone size={12} /></span> 010-060-0160</p>
                  <p><span className="icon"><Mail size={12} /></span> <a href="mailto:contact@cardioai.com">contact@cardioai.com</a></p>
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="footer-thumb">
                <h4 className="fade-in-up delay-2">Latest Research</h4>
                <div className="latest-stories">
                  <img src={newsImage} alt="ECG Research" />
                  <div className="stories-info">
                    <h5><a href="#">ECG Deep Learning Advances</a></h5>
                    <span>March 15, 2026</span>
                  </div>
                </div>
                <div className="latest-stories">
                  <img src={newsImage} alt="Cardiac AI" />
                  <div className="stories-info">
                    <h5><a href="#">Cardiac Signal Processing</a></h5>
                    <span>February 28, 2026</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="footer-thumb">
                <div className="opening-hours">
                  <h4 className="fade-in-up delay-2">Platform Hours</h4>
                  <p>Monday – Friday <span>08:00 AM – 06:00 PM</span></p>
                  <p>Saturday <span>09:00 AM – 02:00 PM</span></p>
                  <p>Sunday <span>Maintenance Window</span></p>
                </div>
                <div className="social-icon" style={{ marginTop: 15 }}>
                  <a href="#" aria-label="LinkedIn"><Linkedin size={14} /></a>
                  <a href="#" aria-label="Twitter"><Twitter size={14} /></a>
                  <a href="#" aria-label="Contact"><Send size={14} /></a>
                </div>
              </div>
            </div>
          </div>

          <div className="row border-top" style={{ alignItems: 'center' }}>
            <div className="col-4">
              <div className="copyright-text">
                <p>Copyright &copy; 2026 CardioAI — Cardiac Diagnosis Platform</p>
              </div>
            </div>
            <div className="col-6">
              <div className="footer-link">
                <a href="#">ECG Analysis</a>
                <a href="#">Cardiac Research</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Careers</a>
              </div>
            </div>
            <div className="col-2 text-align-center">
              <div className="angle-up-btn">
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo('#home');
                  }}
                  aria-label="Back to top"
                >
                  <ChevronUp size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
