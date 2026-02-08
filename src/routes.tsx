import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { HomePage } from "./pages/HomePage";
import { ProductListPage } from "./pages/ProductListPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderCompletePage } from "./pages/OrderCompletePage";
import { RootLayout } from "./components/RootLayout";
import { MyPageLayout } from "./pages/MyPageLayout";
import { OrdersPage } from "./pages/OrdersPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { MySubscriptionsPage } from "./pages/MySubscriptionsPage";
import { CommunicationLayout } from "./pages/CommunicationLayout";
import { InquiryListPage } from "./pages/InquiryListPage";
import { InquiryWritePage } from "./pages/InquiryWritePage";
import { InquiryDetailPage } from "./pages/InquiryDetailPage";
import { FAQPage } from "./pages/FAQPage";
import { ManualPage } from "./pages/ManualPage";
import { EducationPage } from "./pages/EducationPage";
import { DemoRequestPage } from "./pages/DemoRequestPage";
import { NewsPage } from "./pages/NewsPage";
import { NewsDetailPage } from "./pages/NewsDetailPage";
import { MediaPage } from "./pages/MediaPage";
import { AdminLayout } from "./pages/AdminLayout";
import { OrderManagementPage } from "./pages/admin/OrderManagementPage";
import { OrderDetailPage } from "./pages/admin/OrderDetailPage";
import { OrderHistoryPage } from "./pages/admin/OrderHistoryPage";
import { SubscriptionListPage } from "./pages/admin/SubscriptionListPage";
import { ProductManagementPage } from "./pages/admin/ProductManagementPage";
import { ProductRegisterPage } from "./pages/admin/ProductRegisterPage";
import { InquiryManagementPage } from "./pages/admin/InquiryManagementPage";
import { FaqManagementPage } from "./pages/admin/FaqManagementPage";
import { ManualManagementPage } from "./pages/admin/ManualManagementPage";
import { EducationManagementPage } from "./pages/admin/EducationManagementPage";
import { DemoManagementPage } from "./pages/admin/DemoManagementPage";
import { NewsManagementPage } from "./pages/admin/NewsManagementPage";
import { MediaManagementPage } from "./pages/admin/MediaManagementPage";
import { MemberManagementPage } from "./pages/admin/MemberManagementPage";
import { AdminManagementPage } from "./pages/admin/AdminManagementPage";
import { AdManagementPage } from "./pages/admin/AdManagementPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QuickOrderPage } from "./pages/QuickOrderPage";
import { PublicLayout } from "./components/PublicLayout";
import { PublicCommunicationLayout } from "./components/PublicCommunicationLayout";
import { SalesOfficeManagementPage } from "./pages/admin/SalesOfficeManagementPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { SalesAnalyticsPage } from "./pages/admin/SalesAnalyticsPage";
import { ProductAnalyticsPage } from "./pages/admin/ProductAnalyticsPage";
import { PeriodSalesPage } from "./pages/admin/PeriodSalesPage";

export const router = createBrowserRouter([
    {
        path: "/login",
        Component: LoginPage,
    },
    {
        path: "/signup",
        Component: SignupPage,
    },
    {
        path: "/public",
        Component: PublicLayout,
        children: [
            {
                path: "",
                Component: PublicCommunicationLayout,
                children: [
                    { path: "faq", Component: FAQPage },
                    { path: "manual", Component: ManualPage },
                    { path: "news", Component: NewsPage },
                    { path: "news/:id", Component: NewsDetailPage },
                    { path: "media", Component: MediaPage },
                ],
            },
        ],
    },
    {
        path: "/",
        Component: RootLayout,
        children: [
            { index: true, Component: HomePage },
            { path: "quick-order", Component: QuickOrderPage },
            { path: "products", Component: ProductListPage },
            { path: "products/:id", Component: ProductDetailPage },
            { path: "cart", Component: CartPage },
            { path: "checkout", Component: CheckoutPage },
            { path: "order-complete/:orderId", Component: OrderCompletePage },
            {
                path: "mypage",
                Component: MyPageLayout,
                children: [
                    { path: "orders", Component: OrdersPage },
                    { path: "equipment", Component: EquipmentPage },
                    { path: "profile", Component: ProfileEditPage },
                    { path: "subscriptions", Component: MySubscriptionsPage },
                ],
            },
            {
                path: "communication",
                Component: CommunicationLayout,
                children: [
                    { path: "inquiry", Component: InquiryListPage },
                    { path: "inquiry/write", Component: InquiryWritePage },
                    { path: "inquiry/:id", Component: InquiryDetailPage },
                    { path: "faq", Component: FAQPage },
                    { path: "manual", Component: ManualPage },
                    { path: "education", Component: EducationPage },
                    { path: "demo", Component: DemoRequestPage },
                    { path: "news", Component: NewsPage },
                    { path: "news/:id", Component: NewsDetailPage },
                    { path: "media", Component: MediaPage },
                ],
            },
            { path: "*", Component: NotFoundPage },
        ],
    },
    {
        path: "/admin",
        Component: AdminLayout,
        children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace /> },
            { path: "dashboard", Component: DashboardPage },
            { path: "orders", Component: OrderManagementPage },
            { path: "order-history", Component: OrderHistoryPage },
            { path: "subscriptions", Component: SubscriptionListPage },
            { path: "orders/:id", Component: OrderDetailPage },
            { path: "products", Component: ProductManagementPage },
            { path: "products/register", Component: ProductRegisterPage },
            { path: "products/edit/:id", Component: ProductRegisterPage },
            { path: "sales-offices", Component: SalesOfficeManagementPage },
            { path: "statistics/sales", Component: SalesAnalyticsPage },
            { path: "statistics/products", Component: ProductAnalyticsPage },
            { path: "statistics/period-sales", Component: PeriodSalesPage },
            { path: "communication/inquiry", Component: InquiryManagementPage },
            { path: "communication/faq", Component: FaqManagementPage },
            { path: "communication/manual", Component: ManualManagementPage },
            { path: "communication/education", Component: EducationManagementPage },
            { path: "communication/demo", Component: DemoManagementPage },
            { path: "communication/news", Component: NewsManagementPage },
            { path: "communication/media", Component: MediaManagementPage },
            { path: "members", Component: MemberManagementPage },
            { path: "admins", Component: AdminManagementPage },
            { path: "ads", Component: AdManagementPage },
            { path: "ads/stats", Component: AdManagementPage },
        ],
    },
], {
    basename: import.meta.env.BASE_URL
});
