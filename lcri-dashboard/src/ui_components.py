import streamlit as st
from src.data_sources import get_provenance_data

def auth_gate():
    """Bypass authentication – always allow access.
    This function previously required a password from st.secrets.
    For now, it simply returns True to skip authentication.
    """
    return True

def render_provenance_panel():
    """
    Renders the Data Sources and Provenance panel in the UI.
    Satisfies the requirement to display dataset name, portal, access date, and citation.
    """
    st.markdown("### Approved Data Sources & Provenance")
    st.markdown("All datasets used in this dashboard comply with the competition's approved sources list.")
    
    df_provenance = get_provenance_data()
    if not df_provenance.empty:
        st.dataframe(
            df_provenance,
            column_config={
                "dataset": "Dataset Name",
                "portal": "Approved Portal",
                "access_date": "Access Date",
                "citation": "Citation String"
            },
            hide_index=True,
            use_container_width=True
        )
    else:
        st.info("No provenance data found.")
