import { useEffect } from "react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


export default function lottieAnimation(animationName: string) {
    try{
        return(
            <div>
                <DotLottieReact
                src={`/lottieFiles/${animationName.toLowerCase()}.lottie`}
                autoplay
                loop
                />
            </div>
        )
    }
    catch{
        return(
            <div>
                <p>{animationName}</p>
            </div>
        );
    }
}