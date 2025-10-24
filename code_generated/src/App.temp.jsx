/* Add to the top of your App.jsx */
const AnimatedSection = ({ expanded, children }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div
      style={{
        height: expanded ? `${height}px` : '0px',
        overflow: 'hidden',
        transition: 'height 0.3s ease-out'
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};