

// import Breadcrumb from '@/components/breadcrumb/breadcrumb';
import Link from 'next/link';
// import styles from './notfound.module.css';
  
export default function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      {/* <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'not-found' }]} /> */}
      <div  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid #FF6347', padding: '40px', borderRadius: '10px' }}>
        <h1 >404</h1>
        <Link style={{color: '#FF6347', marginTop: '15px'}} href="/">Quay lại trang chủ</Link>  
      </div>
    </div>
  );
}