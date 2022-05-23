

const isMobile = () => {
    //@ts-ignore
    const  userAgent = navigator.userAgent || navigator.vendor || window.opera;


    if (/android/i.test(userAgent)) {
        return true;
    }

    //@ts-ignore
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return true;
    }

    if (window.innerWidth < 530) {
        return true;
    }

    return false;
}

export default isMobile