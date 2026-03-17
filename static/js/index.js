window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

function setupMosaicVideoWall() {
    const mosaicContainer = document.querySelector('.video-mosaic');
    if (!mosaicContainer) return;

    const fallbackSources = [
        'static/videos/carousel1.mp4',
        'static/videos/carousel2.mp4',
        'static/videos/carousel3.mp4',
        'static/videos/banner_video.mp4'
    ];

    function switchToFallback(video, index) {
        if (video.dataset.fallbackApplied === '1') return;

        const source = video.querySelector('source');
        if (!source) return;

        const fallbackSrc = fallbackSources[index % fallbackSources.length];
        source.src = fallbackSrc;
        video.dataset.fallbackApplied = '1';
        video.load();
        video.play().catch(() => {
            // If fallback also fails, browser support is likely very limited.
        });
    }

    const targetCellCount = 60; // 10 rows x 6 columns
    const seedVideos = Array.from(mosaicContainer.querySelectorAll('.mosaic-video'));

    if (seedVideos.length === 0) return;

    while (mosaicContainer.querySelectorAll('.mosaic-video').length < targetCellCount) {
        const currentCount = mosaicContainer.querySelectorAll('.mosaic-video').length;
        const template = seedVideos[currentCount % seedVideos.length];
        const clone = template.cloneNode(true);
        mosaicContainer.appendChild(clone);
    }

    const mosaicVideos = mosaicContainer.querySelectorAll('.mosaic-video');

    mosaicVideos.forEach((video, index) => {
        // Ensure autoplay policy requirements are met consistently across browsers.
        video.muted = true;
        video.defaultMuted = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;

        video.playbackRate = 0.9 + (index % 4) * 0.05;

        video.addEventListener('loadedmetadata', function() {
            if (video.duration && Number.isFinite(video.duration)) {
                video.currentTime = (video.duration * ((index * 17) % 100)) / 100;
            }

            video.play().catch(() => {
                switchToFallback(video, index);
            });
        });

        video.addEventListener('error', function() {
            console.warn('Video failed to decode/play:', video.currentSrc || video.src);
            switchToFallback(video, index);
        });

        video.play().catch(() => {
            switchToFallback(video, index);
        });

        // Detect stalls that often appear as persistent black frames.
        setTimeout(function() {
            if (video.readyState < 2 || video.currentTime === 0) {
                switchToFallback(video, index);
            }
        }, 2500);
    });
}

$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var datasetCarouselOptions = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: true,
        autoplay: false,
        navigation: true,
        pagination: true,
    }

    var videoCarouselOptions = {
        slidesToScroll: 1,
        slidesToShow: 1,
        loop: true,
        infinite: true,
        autoplay: true,
        autoplaySpeed: 5000,
        navigation: true,
        pagination: true,
    }

    // Initialize carousels separately to avoid conflicting interaction behavior.
    bulmaCarousel.attach('#dataset-carousel', datasetCarouselOptions);
    bulmaCarousel.attach('#generalized-bsa-carousel', datasetCarouselOptions);
    bulmaCarousel.attach('#downstream-applications-carousel', datasetCarouselOptions);
	
    bulmaSlider.attach();
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

    // Setup mosaic video wall playback behavior
    setupMosaicVideoWall();

})
