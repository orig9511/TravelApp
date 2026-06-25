# TravelApp – Travel Inventory & Booking Platform

## Overview

TravelApp is a modern full-stack travel booking and inventory management platform built with Angular 18 and Firebase.
The project was designed as a scalable portfolio-grade application that simulates real-world travel agency operations, including offer management, fixed-date travel instances, booking workflows, availability tracking, and responsive user experience.

The primary focus of the project is not only UI development, but also backend architecture design, scalable data modeling, and production-oriented application structure.

---

# Features

## Travel Offers System

- Dynamic travel offers
- Multiple offer categories
- Responsive offer cards
- Detailed offer pages
- Image-based travel presentation
- Offer filtering and searching

## Booking Engine

- Fixed-date offer instances
- Capacity management
- Available seat tracking
- Booking workflow
- Reservation validation
- Real-time availability handling

## Advanced Filtering

- Continent filtering
- Date range filtering
- Category filtering
- Dynamic client-side filtering logic
- Resettable filter states

## Favorites System

- Save favorite offers
- Persistent local storage support
- User-oriented UX flow

## Responsive UI/UX

- Mobile-first responsive design
- Modern Angular component architecture
- SCSS styling system
- Optimized layouts
- Interactive UI elements

---

# Tech Stack

## Frontend

- Angular 18
- TypeScript
- RxJS
- SCSS

## Backend & Database

- Firebase
- Firestore Database
- Firebase Authentication

## Architecture

- Modular Angular architecture
- Service-based business logic
- Observable state handling
- Firestore denormalized data model

---

# Data Architecture

The application uses a scalable Firestore structure with separated collections:

## Collections

- `offers`
- `offerInstances`
- `bookings`

## Design Principles

- Flat scalable structure
- Denormalized fields for performance optimization
- Reference-based relationships
- Centralized booking logic
- Fixed-date inventory management

OfferInstances act as the central booking entities containing:

- capacity
- availableCapacity
- travel dates
- optional flight metadata
- booking references

---

# Project Goals

The project was created to demonstrate:

- scalable frontend architecture
- real-world booking system design
- Firebase/Firestore architecture knowledge
- advanced Angular development
- state management concepts
- modular software engineering
- production-oriented application structure

---

# Planned Features

- User authentication system
- Checkout workflow
- Order management
- Admin dashboard
- Analytics and statistics
- Notification system
- Booking state machine
- Payment integration
- Multi-role authorization

---

# Screenshots

_Add screenshots here_

---

# Installation

## Clone Repository

```bash
git clone https://github.com/orig9511/TravelApp.git
```

## Install Dependencies

```bash
npm install
```

## Start Development Server

```bash
ng serve
```

Navigate to:

```text
http://localhost:4200
```

---

# Environment Setup

Create an `environment.ts` file and add your Firebase configuration:

```typescript
export const environment = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  },
};
```

---

# Learning Outcomes

This project helped improve knowledge in:

- Angular architecture
- Firebase ecosystem
- Firestore data modeling
- scalable frontend engineering
- booking system design
- reactive programming
- state management
- production-grade application structure

---

# License

This project is created for educational and portfolio purposes.
