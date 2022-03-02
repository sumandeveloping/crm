-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 02, 2022 at 01:05 AM
-- Server version: 10.1.36-MariaDB
-- PHP Version: 7.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crm`
--

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` varchar(255) NOT NULL,
  `title` varchar(100) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `assignee` varchar(150) NOT NULL,
  `leadStatus` varchar(100) NOT NULL,
  `leadSource` varchar(150) NOT NULL,
  `leadRating` float NOT NULL,
  `phone` varchar(50) NOT NULL,
  `companyName` varchar(150) NOT NULL,
  `industry` varchar(100) NOT NULL,
  `addressLine1` text NOT NULL,
  `addressLine2` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(150) NOT NULL,
  `country` varchar(100) NOT NULL,
  `zipcode` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `title`, `firstName`, `lastName`, `email`, `assignee`, `leadStatus`, `leadSource`, `leadRating`, `phone`, `companyName`, `industry`, `addressLine1`, `addressLine2`, `city`, `state`, `country`, `zipcode`) VALUES
('78a10c7a-94be-4066-9cbf-0becbf545c17', 'A Test Lead 1', 'John', 'Doe', 'test123@gmail.com', 'Robertson', 'Pending', '', 4.6, '4854648', 'Satisfic', 'IT', '211/A Los Angeles, US, 99', '', 'Los Angeles', 'Lorem', 'US', '1250099'),
('aad9e3d9-fe9c-4300-8cd5-d615fcc0aa91', 'Test Lead 2', 'Andreq', 'Smith', 'test123@gmail.com', 'Robertson', 'Pending', '', 4.9, '8012654896', 'Microsoft', 'IT', '211/A Los Angeles, US, 99', '', 'Chicago', 'Lorem', 'US', '1280099'),
('dddddeeeeeeffffff', 'Test 2', 'Kishor', 'Patil', 'kishor4656@gmail.com', '', '', '', 0, '', '', '', '', '', 'Mumbai', '', '', '788996'),
('jjjjjkkkkkkllllllll', 'Test 4', 'Krushna', 'Patil', 'krushna669888@gmail.com', '', '', '', 0, '', '', '', '', '', 'Nashik', '', '', '4785636');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD UNIQUE KEY `id` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
