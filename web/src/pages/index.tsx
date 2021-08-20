import type { NextPage } from 'next'
import styles from '../styles/Home.module.css'
import Register from './register'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Register />
    </div>
  )
}

export default Home
