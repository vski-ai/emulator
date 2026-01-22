import React from "react";

import { Link, Route, Switch } from "wouter";
import { Header } from "@/components/Header.tsx";
import { Footer } from "@/components/Footer.tsx";
import { WorkflowPage } from "@/pages/Workflow.tsx";
import { Home } from "@/pages/Home.tsx";

export default function App() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content pb-10">
      <Header />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/workflow/:id" component={WorkflowPage} />
          <Route>
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold">404</h1>
              <p>Page not found</p>
              <Link href="/" className="btn btn-primary mt-4">Go Home</Link>
            </div>
          </Route>
        </Switch>
        <Footer />
      </main>
    </div>
  );
}
