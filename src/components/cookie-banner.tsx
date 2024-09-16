/* eslint-disable tailwindcss/no-arbitrary-value */
/* eslint-disable tailwindcss/no-unnecessary-arbitrary-value */
import {
    CookieInput,
    CookieBanner as PHCookieBanner,
} from '@powerhousedao/design-system';
import { Trans, useTranslation } from 'react-i18next';
import { useAcceptedCookies } from 'src/hooks/useAcceptedCookies';
import { useCookieBanner } from 'src/hooks/useCookieBanner';

const isCookieAccepted = (cookies: CookieInput[], id: string) => {
    return cookies.some(cookie => cookie.id === id && cookie.value);
};

export const CookieBanner = () => {
    const { t } = useTranslation();
    const [showBanner, setShowBanner] = useCookieBanner();
    const [, setAcceptedCookies] = useAcceptedCookies();

    const cookiesInput: CookieInput[] = [
        {
            id: 'functional-cookie',
            label: t('cookieBanner.cookies.functional'),
            value: true,
        },
        {
            id: 'analytics-cookie',
            label: t('cookieBanner.cookies.analytics'),
            value: true,
        },
    ];

    const handleAccept = (cookies: CookieInput[]) => {
        console.log(cookies);
        setShowBanner(false);

        if (isCookieAccepted(cookies, 'analytics-cookie')) {
            setAcceptedCookies(acceptedCookies => ({
                ...acceptedCookies,
                analytics: true,
            }));
        }

        if (isCookieAccepted(cookies, 'functional-cookie')) {
            setAcceptedCookies(acceptedCookies => ({
                ...acceptedCookies,
                functional: true,
            }));
        }
    };

    if (!showBanner) {
        return null;
    }

    return (
        <div className="absolute inset-0 z-[10000] backdrop-blur-sm">
            <div className="absolute inset-0 bg-black opacity-15" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center bg-white px-10 pb-16 pt-10 shadow-lg">
                <PHCookieBanner
                    className="max-w-[1024px] "
                    cookies={cookiesInput}
                    onSubmit={handleAccept}
                    onReject={() => setShowBanner(false)}
                    submitLabel={t('cookieBanner.accept')}
                    rejectLabel={t('cookieBanner.reject')}
                >
                    <p className="font-semibold text-gray-500">
                        <Trans
                            i18nKey="cookieBanner.message"
                            components={{
                                a: (
                                    <a
                                        href="https://expenses.makerdao.network/cookies-policy"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-gray-900 hover:underline"
                                    />
                                ),
                            }}
                        />
                    </p>
                </PHCookieBanner>
            </div>
        </div>
    );
};