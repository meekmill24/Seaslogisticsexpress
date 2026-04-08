import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Seas Logistics Express",
  description: "Worldwide Shipping, Express Delivery, and Warehousing Solutions",
};

import { GlobalizationProvider } from "@/context/GlobalizationContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <GlobalizationProvider>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
          <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Mapbox Search JS */}
        <Script 
          src="https://api.mapbox.com/search-js/v1.0.0/web.js" 
          defer 
          strategy="afterInteractive" 
        />
      </head>
      <body>
        {children}
        {/* Popper.js - required by Bootstrap */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"
          integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Bootstrap JS */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js"
          integrity="sha384-0pUGZvbkm6XF6gxjEnlmuGrJXVbNuzT9qBBavbLwCsOGabYfZo0T0to5eqruptLy"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Initialize carousels after Bootstrap loads */}
        <Script id="init-carousel" strategy="afterInteractive">{`
          function initAllCarousels() {
            if (typeof bootstrap === 'undefined') return;
            
            ['heroCarousel', 'testimonialCarousel'].forEach(id => {
              var el = document.getElementById(id);
              if (el) {
                var inst = bootstrap.Carousel.getInstance(el);
                if (!inst) {
                  new bootstrap.Carousel(el, {
                    interval: 3000,
                    ride: 'carousel',
                    pause: 'hover',
                    wrap: true
                  });
                }
              }
            });
          }

          document.addEventListener('DOMContentLoaded', initAllCarousels);
          
          (function() {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
              setTimeout(initAllCarousels, 1000);
            }
          })();
        `}</Script>
        {/* Tawk.to Live Chat - Global Dispatch & Chromatic Sync */}
        <Script id="tawk-to" strategy="afterInteractive">{`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          Tawk_API.customStyle = {
            visibility : {
              desktop : { position : 'br', xOffset : 25, yOffset : 25 },
              mobile : { position : 'br', xOffset : 15, yOffset : 15 }
            }
          };
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/67c79a2d2b7abb190cf1c623/1ilhr4hch';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `}</Script>
      </body>
      </GlobalizationProvider>
    </html>
  );
}
