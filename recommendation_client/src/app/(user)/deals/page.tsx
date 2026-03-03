import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import DealPage from "@/components/user/deals/DealPage"

const page = () => {
return (
    <div>
         <div className="min-h-screen bg-white mt-10">
        <Header />
        <div className="">
        <DealPage />
        </div>
        <Footer />
        </div>
    </div>
)
}
export default page