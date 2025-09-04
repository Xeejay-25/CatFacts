import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md  text-sidebar-primary-foreground">
                <img
                    src="/images/logo.png"
                    alt="SPMC Payroll"
                    className="size-20 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-center text-sm">
                <span className="mb-0.5 leading-tight font-semibold">
                    CATCHUCHU FACTS
                </span>
            </div>
        </>
    );
}
